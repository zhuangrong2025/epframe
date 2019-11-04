/**
 * jsbn.js
 */
define(function(require, exports, module) {
	/**
 * jsbn.js
 */
var dbits, canary = 0xdeadbeefcafe,
j_lm = 15715070 == (canary & 16777215);
function BigInteger(a, b, c) {
    null != a && ("number" == typeof a ? this.fromNumber(a, b, c) : null == b && "string" != typeof a ? this.fromString(a, 256) : this.fromString(a, b))
}
function nbi() {
    return new BigInteger(null)
}
function am1(a, b, c, d, e, f) {
    for (; 0 <= --f;) {
        var g = b * this[a++] + c[d] + e;
        e = Math.floor(g / 67108864);
        c[d++] = g & 67108863
    }
    return e
}
function am2(a, b, c, d, e, f) {
    var g = b & 32767;
    for (b >>= 15; 0 <= --f;) {
        var h = this[a] & 32767,
        k = this[a++] >> 15,
        m = b * h + k * g;
        h = g * h + ((m & 32767) << 15) + c[d] + (e & 1073741823);
        e = (h >>> 30) + (m >>> 15) + b * k + (e >>> 30);
        c[d++] = h & 1073741823
    }
    return e
}
function am3(a, b, c, d, e, f) {
    var g = b & 16383;
    for (b >>= 14; 0 <= --f;) {
        var h = this[a] & 16383,
        k = this[a++] >> 14,
        m = b * h + k * g;
        h = g * h + ((m & 16383) << 14) + c[d] + e;
        e = (h >> 28) + (m >> 14) + b * k;
        c[d++] = h & 268435455
    }
    return e
}
j_lm && "Microsoft Internet Explorer" == navigator.appName ? (BigInteger.prototype.am = am2, dbits = 30) : j_lm && "Netscape" != navigator.appName ? (BigInteger.prototype.am = am1, dbits = 26) : (BigInteger.prototype.am = am3, dbits = 28);
BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = (1 << dbits) - 1;
BigInteger.prototype.DV = 1 << dbits;
var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2, BI_FP);
BigInteger.prototype.F1 = BI_FP - dbits;
BigInteger.prototype.F2 = 2 * dbits - BI_FP;
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz",
BI_RC = [],
rr,
vv;
rr = 48;
for (vv = 0; 9 >= vv; ++vv) BI_RC[rr++] = vv;
rr = 97;
for (vv = 10; 36 > vv; ++vv) BI_RC[rr++] = vv;
rr = 65;
for (vv = 10; 36 > vv; ++vv) BI_RC[rr++] = vv;
function int2char(a) {
    return BI_RM.charAt(a)
}
function intAt(a, b) {
    a = BI_RC[a.charCodeAt(b)];
    return null == a ? -1 : a
}
function bnpCopyTo(a) {
    for (var b = this.t - 1; 0 <= b; --b) a[b] = this[b];
    a.t = this.t;
    a.s = this.s
}
function bnpFromInt(a) {
    this.t = 1;
    this.s = 0 > a ? -1 : 0;
    0 < a ? this[0] = a: -1 > a ? this[0] = a + this.DV: this.t = 0
}
function nbv(a) {
    var b = nbi();
    b.fromInt(a);
    return b
}
function bnpFromString(a, b) {
    if (16 == b) b = 4;
    else if (8 == b) b = 3;
    else if (256 == b) b = 8;
    else if (2 == b) b = 1;
    else if (32 == b) b = 5;
    else if (4 == b) b = 2;
    else {
        this.fromRadix(a, b);
        return
    }
    this.s = this.t = 0;
    for (var c = a.length,
    d = !1,
    e = 0; 0 <= --c;) {
        var f = 8 == b ? a[c] & 255 : intAt(a, c);
        0 > f ? "-" == a.charAt(c) && (d = !0) : (d = !1, 0 == e ? this[this.t++] = f: e + b > this.DB ? (this[this.t - 1] |= (f & (1 << this.DB - e) - 1) << e, this[this.t++] = f >> this.DB - e) : this[this.t - 1] |= f << e, e += b, e >= this.DB && (e -= this.DB))
    }
    8 == b && 0 != (a[0] & 128) && (this.s = -1, 0 < e && (this[this.t - 1] |= (1 << this.DB - e) - 1 << e));
    this.clamp();
    d && BigInteger.ZERO.subTo(this, this)
}
function bnpClamp() {
    for (var a = this.s & this.DM; 0 < this.t && this[this.t - 1] == a;)--this.t
}
function bnToString(a) {
    if (0 > this.s) return "-" + this.negate().toString(a);
    if (16 == a) a = 4;
    else if (8 == a) a = 3;
    else if (2 == a) a = 1;
    else if (32 == a) a = 5;
    else if (4 == a) a = 2;
    else return this.toRadix(a);
    var b = (1 << a) - 1,
    c,
    d = !1,
    e = "",
    f = this.t,
    g = this.DB - f * this.DB % a;
    if (0 < f--) for (g < this.DB && 0 < (c = this[f] >> g) && (d = !0, e = int2char(c)); 0 <= f;) g < a ? (c = (this[f] & (1 << g) - 1) << a - g, c |= this[--f] >> (g += this.DB - a)) : (c = this[f] >> (g -= a) & b, 0 >= g && (g += this.DB, --f)),
    0 < c && (d = !0),
    d && (e += int2char(c));
    return d ? e: "0"
}
function bnNegate() {
    var a = nbi();
    BigInteger.ZERO.subTo(this, a);
    return a
}
function bnAbs() {
    return 0 > this.s ? this.negate() : this
}
function bnCompareTo(a) {
    var b = this.s - a.s;
    if (0 != b) return b;
    var c = this.t;
    b = c - a.t;
    if (0 != b) return 0 > this.s ? -b: b;
    for (; 0 <= --c;) if (0 != (b = this[c] - a[c])) return b;
    return 0
}
function nbits(a) {
    var b = 1,
    c;
    0 != (c = a >>> 16) && (a = c, b += 16);
    0 != (c = a >> 8) && (a = c, b += 8);
    0 != (c = a >> 4) && (a = c, b += 4);
    0 != (c = a >> 2) && (a = c, b += 2);
    0 != a >> 1 && (b += 1);
    return b
}
function bnBitLength() {
    return 0 >= this.t ? 0 : this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM)
}
function bnpDLShiftTo(a, b) {
    var c;
    for (c = this.t - 1; 0 <= c; --c) b[c + a] = this[c];
    for (c = a - 1; 0 <= c; --c) b[c] = 0;
    b.t = this.t + a;
    b.s = this.s
}
function bnpDRShiftTo(a, b) {
    for (var c = a; c < this.t; ++c) b[c - a] = this[c];
    b.t = Math.max(this.t - a, 0);
    b.s = this.s
}
function bnpLShiftTo(a, b) {
    var c = a % this.DB,
    d = this.DB - c,
    e = (1 << d) - 1;
    a = Math.floor(a / this.DB);
    var f = this.s << c & this.DM,
    g;
    for (g = this.t - 1; 0 <= g; --g) b[g + a + 1] = this[g] >> d | f,
    f = (this[g] & e) << c;
    for (g = a - 1; 0 <= g; --g) b[g] = 0;
    b[a] = f;
    b.t = this.t + a + 1;
    b.s = this.s;
    b.clamp()
}
function bnpRShiftTo(a, b) {
    b.s = this.s;
    var c = Math.floor(a / this.DB);
    if (c >= this.t) b.t = 0;
    else {
        a %= this.DB;
        var d = this.DB - a,
        e = (1 << a) - 1;
        b[0] = this[c] >> a;
        for (var f = c + 1; f < this.t; ++f) b[f - c - 1] |= (this[f] & e) << d,
        b[f - c] = this[f] >> a;
        0 < a && (b[this.t - c - 1] |= (this.s & e) << d);
        b.t = this.t - c;
        b.clamp()
    }
}
function bnpSubTo(a, b) {
    for (var c = 0,
    d = 0,
    e = Math.min(a.t, this.t); c < e;) d += this[c] - a[c],
    b[c++] = d & this.DM,
    d >>= this.DB;
    if (a.t < this.t) {
        for (d -= a.s; c < this.t;) d += this[c],
        b[c++] = d & this.DM,
        d >>= this.DB;
        d += this.s
    } else {
        for (d += this.s; c < a.t;) d -= a[c],
        b[c++] = d & this.DM,
        d >>= this.DB;
        d -= a.s
    }
    b.s = 0 > d ? -1 : 0; - 1 > d ? b[c++] = this.DV + d: 0 < d && (b[c++] = d);
    b.t = c;
    b.clamp()
}
function bnpMultiplyTo(a, b) {
    var c = this.abs(),
    d = a.abs(),
    e = c.t;
    for (b.t = e + d.t; 0 <= --e;) b[e] = 0;
    for (e = 0; e < d.t; ++e) b[e + c.t] = c.am(0, d[e], b, e, 0, c.t);
    b.s = 0;
    b.clamp();
    this.s != a.s && BigInteger.ZERO.subTo(b, b)
}
function bnpSquareTo(a) {
    for (var b = this.abs(), c = a.t = 2 * b.t; 0 <= --c;) a[c] = 0;
    for (c = 0; c < b.t - 1; ++c) {
        var d = b.am(c, b[c], a, 2 * c, 0, 1); (a[c + b.t] += b.am(c + 1, 2 * b[c], a, 2 * c + 1, d, b.t - c - 1)) >= b.DV && (a[c + b.t] -= b.DV, a[c + b.t + 1] = 1)
    }
    0 < a.t && (a[a.t - 1] += b.am(c, b[c], a, 2 * c, 0, 1));
    a.s = 0;
    a.clamp()
}
function bnpDivRemTo(a, b, c) {
    var d = a.abs();
    if (! (0 >= d.t)) {
        var e = this.abs();
        if (e.t < d.t) null != b && b.fromInt(0),
        null != c && this.copyTo(c);
        else {
            null == c && (c = nbi());
            var f = nbi(),
            g = this.s;
            a = a.s;
            var h = this.DB - nbits(d[d.t - 1]);
            0 < h ? (d.lShiftTo(h, f), e.lShiftTo(h, c)) : (d.copyTo(f), e.copyTo(c));
            d = f.t;
            e = f[d - 1];
            if (0 != e) {
                var k = e * (1 << this.F1) + (1 < d ? f[d - 2] >> this.F2: 0),
                m = this.FV / k;
                k = (1 << this.F1) / k;
                var r = 1 << this.F2,
                n = c.t,
                p = n - d,
                l = null == b ? nbi() : b;
                f.dlShiftTo(p, l);
                0 <= c.compareTo(l) && (c[c.t++] = 1, c.subTo(l, c));
                BigInteger.ONE.dlShiftTo(d, l);
                for (l.subTo(f, f); f.t < d;) f[f.t++] = 0;
                for (; 0 <= --p;) {
                    var q = c[--n] == e ? this.DM: Math.floor(c[n] * m + (c[n - 1] + r) * k);
                    if ((c[n] += f.am(0, q, c, p, 0, d)) < q) for (f.dlShiftTo(p, l), c.subTo(l, c); c[n] < --q;) c.subTo(l, c)
                }
                null != b && (c.drShiftTo(d, b), g != a && BigInteger.ZERO.subTo(b, b));
                c.t = d;
                c.clamp();
                0 < h && c.rShiftTo(h, c);
                0 > g && BigInteger.ZERO.subTo(c, c)
            }
        }
    }
}
function bnMod(a) {
    var b = nbi();
    this.abs().divRemTo(a, null, b);
    0 > this.s && 0 < b.compareTo(BigInteger.ZERO) && a.subTo(b, b);
    return b
}
function Classic(a) {
    this.m = a
}
function cConvert(a) {
    return 0 > a.s || 0 <= a.compareTo(this.m) ? a.mod(this.m) : a
}
function cRevert(a) {
    return a
}
function cReduce(a) {
    a.divRemTo(this.m, null, a)
}
function cMulTo(a, b, c) {
    a.multiplyTo(b, c);
    this.reduce(c)
}
function cSqrTo(a, b) {
    a.squareTo(b);
    this.reduce(b)
}
Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;
function bnpInvDigit() {
    if (1 > this.t) return 0;
    var a = this[0];
    if (0 == (a & 1)) return 0;
    var b = a & 3;
    b = b * (2 - (a & 15) * b) & 15;
    b = b * (2 - (a & 255) * b) & 255;
    b = b * (2 - ((a & 65535) * b & 65535)) & 65535;
    b = b * (2 - a * b % this.DV) % this.DV;
    return 0 < b ? this.DV - b: -b
}
function Montgomery(a) {
    this.m = a;
    this.mp = a.invDigit();
    this.mpl = this.mp & 32767;
    this.mph = this.mp >> 15;
    this.um = (1 << a.DB - 15) - 1;
    this.mt2 = 2 * a.t
}
function montConvert(a) {
    var b = nbi();
    a.abs().dlShiftTo(this.m.t, b);
    b.divRemTo(this.m, null, b);
    0 > a.s && 0 < b.compareTo(BigInteger.ZERO) && this.m.subTo(b, b);
    return b
}
function montRevert(a) {
    var b = nbi();
    a.copyTo(b);
    this.reduce(b);
    return b
}
function montReduce(a) {
    for (; a.t <= this.mt2;) a[a.t++] = 0;
    for (var b = 0; b < this.m.t; ++b) {
        var c = a[b] & 32767,
        d = c * this.mpl + ((c * this.mph + (a[b] >> 15) * this.mpl & this.um) << 15) & a.DM;
        c = b + this.m.t;
        for (a[c] += this.m.am(0, d, a, b, 0, this.m.t); a[c] >= a.DV;) a[c] -= a.DV,
        a[++c]++
    }
    a.clamp();
    a.drShiftTo(this.m.t, a);
    0 <= a.compareTo(this.m) && a.subTo(this.m, a)
}
function montSqrTo(a, b) {
    a.squareTo(b);
    this.reduce(b)
}
function montMulTo(a, b, c) {
    a.multiplyTo(b, c);
    this.reduce(c)
}
Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;
function bnpIsEven() {
    return 0 == (0 < this.t ? this[0] & 1 : this.s)
}
function bnpExp(a, b) {
    if (4294967295 < a || 1 > a) return BigInteger.ONE;
    var c = nbi(),
    d = nbi(),
    e = b.convert(this),
    f = nbits(a) - 1;
    for (e.copyTo(c); 0 <= --f;) if (b.sqrTo(c, d), 0 < (a & 1 << f)) b.mulTo(d, e, c);
    else {
        var g = c;
        c = d;
        d = g
    }
    return b.revert(c)
}
function bnModPowInt(a, b) {
    b = 256 > a || b.isEven() ? new Classic(b) : new Montgomery(b);
    return this.exp(a, b)
}
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);

/**
 * jsbn2.js
 */
function bnClone() {
    var a = nbi();
    this.copyTo(a);
    return a
}
function bnIntValue() {
    if (0 > this.s) {
        if (1 == this.t) return this[0] - this.DV;
        if (0 == this.t) return - 1
    } else {
        if (1 == this.t) return this[0];
        if (0 == this.t) return 0
    }
    return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0]
}
function bnByteValue() {
    return 0 == this.t ? this.s: this[0] << 24 >> 24
}
function bnShortValue() {
    return 0 == this.t ? this.s: this[0] << 16 >> 16
}
function bnpChunkSize(a) {
    return Math.floor(Math.LN2 * this.DB / Math.log(a))
}
function bnSigNum() {
    return 0 > this.s ? -1 : 0 >= this.t || 1 == this.t && 0 >= this[0] ? 0 : 1
}
function bnpToRadix(a) {
    null == a && (a = 10);
    if (0 == this.signum() || 2 > a || 36 < a) return "0";
    var b = this.chunkSize(a);
    b = Math.pow(a, b);
    var c = nbv(b),
    d = nbi(),
    e = nbi(),
    g = "";
    for (this.divRemTo(c, d, e); 0 < d.signum();) g = (b + e.intValue()).toString(a).substr(1) + g,
    d.divRemTo(c, d, e);
    return e.intValue().toString(a) + g
}
function bnpFromRadix(a, b) {
    this.fromInt(0);
    null == b && (b = 10);
    for (var c = this.chunkSize(b), d = Math.pow(b, c), e = !1, g = 0, f = 0, h = 0; h < a.length; ++h) {
        var n = intAt(a, h);
        0 > n ? "-" == a.charAt(h) && 0 == this.signum() && (e = !0) : (f = b * f + n, ++g >= c && (this.dMultiply(d), this.dAddOffset(f, 0), f = g = 0))
    }
    0 < g && (this.dMultiply(Math.pow(b, g)), this.dAddOffset(f, 0));
    e && BigInteger.ZERO.subTo(this, this)
}
function bnpFromNumber(a, b, c) {
    if ("number" == typeof b) if (2 > a) this.fromInt(1);
    else for (this.fromNumber(a, c), this.testBit(a - 1) || this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this), this.isEven() && this.dAddOffset(1, 0); ! this.isProbablePrime(b);) this.dAddOffset(2, 0),
    this.bitLength() > a && this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
    else {
        c = [];
        var d = a & 7;
        c.length = (a >> 3) + 1;
        b.nextBytes(c);
        c[0] = 0 < d ? c[0] & (1 << d) - 1 : 0;
        this.fromString(c, 256)
    }
}
function bnToByteArray() {
    var a = this.t,
    b = [];
    b[0] = this.s;
    var c = this.DB - a * this.DB % 8,
    d, e = 0;
    if (0 < a--) for (c < this.DB && (d = this[a] >> c) != (this.s & this.DM) >> c && (b[e++] = d | this.s << this.DB - c); 0 <= a;) if (8 > c ? (d = (this[a] & (1 << c) - 1) << 8 - c, d |= this[--a] >> (c += this.DB - 8)) : (d = this[a] >> (c -= 8) & 255, 0 >= c && (c += this.DB, --a)), 0 != (d & 128) && (d |= -256), 0 == e && (this.s & 128) != (d & 128) && ++e, 0 < e || d != this.s) b[e++] = d;
    return b
}
function bnEquals(a) {
    return 0 == this.compareTo(a)
}
function bnMin(a) {
    return 0 > this.compareTo(a) ? this: a
}
function bnMax(a) {
    return 0 < this.compareTo(a) ? this: a
}
function bnpBitwiseTo(a, b, c) {
    var d, e = Math.min(a.t, this.t);
    for (d = 0; d < e; ++d) c[d] = b(this[d], a[d]);
    if (a.t < this.t) {
        var g = a.s & this.DM;
        for (d = e; d < this.t; ++d) c[d] = b(this[d], g);
        c.t = this.t
    } else {
        g = this.s & this.DM;
        for (d = e; d < a.t; ++d) c[d] = b(g, a[d]);
        c.t = a.t
    }
    c.s = b(this.s, a.s);
    c.clamp()
}
function op_and(a, b) {
    return a & b
}
function bnAnd(a) {
    var b = nbi();
    this.bitwiseTo(a, op_and, b);
    return b
}
function op_or(a, b) {
    return a | b
}
function bnOr(a) {
    var b = nbi();
    this.bitwiseTo(a, op_or, b);
    return b
}
function op_xor(a, b) {
    return a ^ b
}
function bnXor(a) {
    var b = nbi();
    this.bitwiseTo(a, op_xor, b);
    return b
}
function op_andnot(a, b) {
    return a & ~b
}
function bnAndNot(a) {
    var b = nbi();
    this.bitwiseTo(a, op_andnot, b);
    return b
}
function bnNot() {
    for (var a = nbi(), b = 0; b < this.t; ++b) a[b] = this.DM & ~this[b];
    a.t = this.t;
    a.s = ~this.s;
    return a
}
function bnShiftLeft(a) {
    var b = nbi();
    0 > a ? this.rShiftTo( - a, b) : this.lShiftTo(a, b);
    return b
}
function bnShiftRight(a) {
    var b = nbi();
    0 > a ? this.lShiftTo( - a, b) : this.rShiftTo(a, b);
    return b
}
function lbit(a) {
    if (0 == a) return - 1;
    var b = 0;
    0 == (a & 65535) && (a >>= 16, b += 16);
    0 == (a & 255) && (a >>= 8, b += 8);
    0 == (a & 15) && (a >>= 4, b += 4);
    0 == (a & 3) && (a >>= 2, b += 2);
    0 == (a & 1) && ++b;
    return b
}
function bnGetLowestSetBit() {
    for (var a = 0; a < this.t; ++a) if (0 != this[a]) return a * this.DB + lbit(this[a]);
    return 0 > this.s ? this.t * this.DB: -1
}
function cbit(a) {
    for (var b = 0; 0 != a;) a &= a - 1,
    ++b;
    return b
}
function bnBitCount() {
    for (var a = 0,
    b = this.s & this.DM,
    c = 0; c < this.t; ++c) a += cbit(this[c] ^ b);
    return a
}
function bnTestBit(a) {
    var b = Math.floor(a / this.DB);
    return b >= this.t ? 0 != this.s: 0 != (this[b] & 1 << a % this.DB)
}
function bnpChangeBit(a, b) {
    a = BigInteger.ONE.shiftLeft(a);
    this.bitwiseTo(a, b, a);
    return a
}
function bnSetBit(a) {
    return this.changeBit(a, op_or)
}
function bnClearBit(a) {
    return this.changeBit(a, op_andnot)
}
function bnFlipBit(a) {
    return this.changeBit(a, op_xor)
}
function bnpAddTo(a, b) {
    for (var c = 0,
    d = 0,
    e = Math.min(a.t, this.t); c < e;) d += this[c] + a[c],
    b[c++] = d & this.DM,
    d >>= this.DB;
    if (a.t < this.t) {
        for (d += a.s; c < this.t;) d += this[c],
        b[c++] = d & this.DM,
        d >>= this.DB;
        d += this.s
    } else {
        for (d += this.s; c < a.t;) d += a[c],
        b[c++] = d & this.DM,
        d >>= this.DB;
        d += a.s
    }
    b.s = 0 > d ? -1 : 0;
    0 < d ? b[c++] = d: -1 > d && (b[c++] = this.DV + d);
    b.t = c;
    b.clamp()
}
function bnAdd(a) {
    var b = nbi();
    this.addTo(a, b);
    return b
}
function bnSubtract(a) {
    var b = nbi();
    this.subTo(a, b);
    return b
}
function bnMultiply(a) {
    var b = nbi();
    this.multiplyTo(a, b);
    return b
}
function bnSquare() {
    var a = nbi();
    this.squareTo(a);
    return a
}
function bnDivide(a) {
    var b = nbi();
    this.divRemTo(a, b, null);
    return b
}
function bnRemainder(a) {
    var b = nbi();
    this.divRemTo(a, null, b);
    return b
}
function bnDivideAndRemainder(a) {
    var b = nbi(),
    c = nbi();
    this.divRemTo(a, b, c);
    return [b, c]
}
function bnpDMultiply(a) {
    this[this.t] = this.am(0, a - 1, this, 0, 0, this.t); ++this.t;
    this.clamp()
}
function bnpDAddOffset(a, b) {
    if (0 != a) {
        for (; this.t <= b;) this[this.t++] = 0;
        for (this[b] += a; this[b] >= this.DV;) this[b] -= this.DV,
        ++b >= this.t && (this[this.t++] = 0),
        ++this[b]
    }
}
function NullExp() {}
function nNop(a) {
    return a
}
function nMulTo(a, b, c) {
    a.multiplyTo(b, c)
}
function nSqrTo(a, b) {
    a.squareTo(b)
}
NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;
function bnPow(a) {
    return this.exp(a, new NullExp)
}
function bnpMultiplyLowerTo(a, b, c) {
    var d = Math.min(this.t + a.t, b);
    c.s = 0;
    for (c.t = d; 0 < d;) c[--d] = 0;
    var e;
    for (e = c.t - this.t; d < e; ++d) c[d + this.t] = this.am(0, a[d], c, d, 0, this.t);
    for (e = Math.min(a.t, b); d < e; ++d) this.am(0, a[d], c, d, 0, b - d);
    c.clamp()
}
function bnpMultiplyUpperTo(a, b, c) {--b;
    var d = c.t = this.t + a.t - b;
    for (c.s = 0; 0 <= --d;) c[d] = 0;
    for (d = Math.max(b - this.t, 0); d < a.t; ++d) c[this.t + d - b] = this.am(b - d, a[d], c, 0, 0, this.t + d - b);
    c.clamp();
    c.drShiftTo(1, c)
}
function Barrett(a) {
    this.r2 = nbi();
    this.q3 = nbi();
    BigInteger.ONE.dlShiftTo(2 * a.t, this.r2);
    this.mu = this.r2.divide(a);
    this.m = a
}
function barrettConvert(a) {
    if (0 > a.s || a.t > 2 * this.m.t) return a.mod(this.m);
    if (0 > a.compareTo(this.m)) return a;
    var b = nbi();
    a.copyTo(b);
    this.reduce(b);
    return b
}
function barrettRevert(a) {
    return a
}
function barrettReduce(a) {
    a.drShiftTo(this.m.t - 1, this.r2);
    a.t > this.m.t + 1 && (a.t = this.m.t + 1, a.clamp());
    this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
    for (this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2); 0 > a.compareTo(this.r2);) a.dAddOffset(1, this.m.t + 1);
    for (a.subTo(this.r2, a); 0 <= a.compareTo(this.m);) a.subTo(this.m, a)
}
function barrettSqrTo(a, b) {
    a.squareTo(b);
    this.reduce(b)
}
function barrettMulTo(a, b, c) {
    a.multiplyTo(b, c);
    this.reduce(c)
}
Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;
function bnModPow(a, b) {
    var c = a.bitLength(),
    d = nbv(1);
    if (0 >= c) return d;
    var e = 18 > c ? 1 : 48 > c ? 3 : 144 > c ? 4 : 768 > c ? 5 : 6;
    b = 8 > c ? new Classic(b) : b.isEven() ? new Barrett(b) : new Montgomery(b);
    var g = [],
    f = 3,
    h = e - 1,
    n = (1 << e) - 1;
    g[1] = b.convert(this);
    if (1 < e) for (c = nbi(), b.sqrTo(g[1], c); f <= n;) g[f] = nbi(),
    b.mulTo(c, g[f - 2], g[f]),
    f += 2;
    var k = a.t - 1,
    p = !0,
    l = nbi();
    for (c = nbits(a[k]) - 1; 0 <= k;) {
        if (c >= h) var m = a[k] >> c - h & n;
        else m = (a[k] & (1 << c + 1) - 1) << h - c,
        0 < k && (m |= a[k - 1] >> this.DB + c - h);
        for (f = e; 0 == (m & 1);) m >>= 1,
        --f;
        0 > (c -= f) && (c += this.DB, --k);
        if (p) g[m].copyTo(d),
        p = !1;
        else {
            for (; 1 < f;) b.sqrTo(d, l),
            b.sqrTo(l, d),
            f -= 2;
            0 < f ? b.sqrTo(d, l) : (f = d, d = l, l = f);
            b.mulTo(l, g[m], d)
        }
        for (; 0 <= k && 0 == (a[k] & 1 << c);) b.sqrTo(d, l),
        f = d,
        d = l,
        l = f,
        0 > --c && (c = this.DB - 1, --k)
    }
    return b.revert(d)
}
function bnGCD(a) {
    var b = 0 > this.s ? this.negate() : this.clone();
    a = 0 > a.s ? a.negate() : a.clone();
    if (0 > b.compareTo(a)) {
        var c = b;
        b = a;
        a = c
    }
    c = b.getLowestSetBit();
    var d = a.getLowestSetBit();
    if (0 > d) return b;
    c < d && (d = c);
    0 < d && (b.rShiftTo(d, b), a.rShiftTo(d, a));
    for (; 0 < b.signum();) 0 < (c = b.getLowestSetBit()) && b.rShiftTo(c, b),
    0 < (c = a.getLowestSetBit()) && a.rShiftTo(c, a),
    0 <= b.compareTo(a) ? (b.subTo(a, b), b.rShiftTo(1, b)) : (a.subTo(b, a), a.rShiftTo(1, a));
    0 < d && a.lShiftTo(d, a);
    return a
}
function bnpModInt(a) {
    if (0 >= a) return 0;
    var b = this.DV % a,
    c = 0 > this.s ? a - 1 : 0;
    if (0 < this.t) if (0 == b) c = this[0] % a;
    else for (var d = this.t - 1; 0 <= d; --d) c = (b * c + this[d]) % a;
    return c
}
function bnModInverse(a) {
    var b = a.isEven();
    if (this.isEven() && b || 0 == a.signum()) return BigInteger.ZERO;
    for (var c = a.clone(), d = this.clone(), e = nbv(1), g = nbv(0), f = nbv(0), h = nbv(1); 0 != c.signum();) {
        for (; c.isEven();) c.rShiftTo(1, c),
        b ? (e.isEven() && g.isEven() || (e.addTo(this, e), g.subTo(a, g)), e.rShiftTo(1, e)) : g.isEven() || g.subTo(a, g),
        g.rShiftTo(1, g);
        for (; d.isEven();) d.rShiftTo(1, d),
        b ? (f.isEven() && h.isEven() || (f.addTo(this, f), h.subTo(a, h)), f.rShiftTo(1, f)) : h.isEven() || h.subTo(a, h),
        h.rShiftTo(1, h);
        0 <= c.compareTo(d) ? (c.subTo(d, c), b && e.subTo(f, e), g.subTo(h, g)) : (d.subTo(c, d), b && f.subTo(e, f), h.subTo(g, h))
    }
    if (0 != d.compareTo(BigInteger.ONE)) return BigInteger.ZERO;
    if (0 <= h.compareTo(a)) return h.subtract(a);
    if (0 > h.signum()) h.addTo(a, h);
    else return h;
    return 0 > h.signum() ? h.add(a) : h
}
var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997],
lplim = 67108864 / lowprimes[lowprimes.length - 1];
function bnIsProbablePrime(a) {
    var b, c = this.abs();
    if (1 == c.t && c[0] <= lowprimes[lowprimes.length - 1]) {
        for (b = 0; b < lowprimes.length; ++b) if (c[0] == lowprimes[b]) return ! 0;
        return ! 1
    }
    if (c.isEven()) return ! 1;
    for (b = 1; b < lowprimes.length;) {
        for (var d = lowprimes[b], e = b + 1; e < lowprimes.length && d < lplim;) d *= lowprimes[e++];
        for (d = c.modInt(d); b < e;) if (0 == d % lowprimes[b++]) return ! 1
    }
    return c.millerRabin(a)
}
function bnpMillerRabin(a) {
    var b = this.subtract(BigInteger.ONE),
    c = b.getLowestSetBit();
    if (0 >= c) return ! 1;
    var d = b.shiftRight(c);
    a = a + 1 >> 1;
    a > lowprimes.length && (a = lowprimes.length);
    for (var e = nbi(), g = 0; g < a; ++g) {
        e.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
        var f = e.modPow(d, this);
        if (0 != f.compareTo(BigInteger.ONE) && 0 != f.compareTo(b)) {
            for (var h = 1; h++<c && 0 != f.compareTo(b);) if (f = f.modPowInt(2, this), 0 == f.compareTo(BigInteger.ONE)) return ! 1;
            if (0 != f.compareTo(b)) return ! 1
        }
    }
    return ! 0
}
BigInteger.prototype.chunkSize = bnpChunkSize;
BigInteger.prototype.toRadix = bnpToRadix;
BigInteger.prototype.fromRadix = bnpFromRadix;
BigInteger.prototype.fromNumber = bnpFromNumber;
BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger.prototype.changeBit = bnpChangeBit;
BigInteger.prototype.addTo = bnpAddTo;
BigInteger.prototype.dMultiply = bnpDMultiply;
BigInteger.prototype.dAddOffset = bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger.prototype.modInt = bnpModInt;
BigInteger.prototype.millerRabin = bnpMillerRabin;
BigInteger.prototype.clone = bnClone;
BigInteger.prototype.intValue = bnIntValue;
BigInteger.prototype.byteValue = bnByteValue;
BigInteger.prototype.shortValue = bnShortValue;
BigInteger.prototype.signum = bnSigNum;
BigInteger.prototype.toByteArray = bnToByteArray;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.min = bnMin;
BigInteger.prototype.max = bnMax;
BigInteger.prototype.and = bnAnd;
BigInteger.prototype.or = bnOr;
BigInteger.prototype.xor = bnXor;
BigInteger.prototype.andNot = bnAndNot;
BigInteger.prototype.not = bnNot;
BigInteger.prototype.shiftLeft = bnShiftLeft;
BigInteger.prototype.shiftRight = bnShiftRight;
BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger.prototype.bitCount = bnBitCount;
BigInteger.prototype.testBit = bnTestBit;
BigInteger.prototype.setBit = bnSetBit;
BigInteger.prototype.clearBit = bnClearBit;
BigInteger.prototype.flipBit = bnFlipBit;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.remainder = bnRemainder;
BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger.prototype.modPow = bnModPow;
BigInteger.prototype.modInverse = bnModInverse;
BigInteger.prototype.pow = bnPow;
BigInteger.prototype.gcd = bnGCD;
BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
BigInteger.prototype.square = bnSquare;

/**
 * utils.js
 */
function bytesToHex(b) {
    for (var a = "",
    d = 0; d < b.length; d++) a += (256 + (b[d] & 255)).toString(16).substring(1);
    return a
}
function hexToBytes(b) {
    for (var a = [], d = b.length, e = 0; e < d; e += 2) a[a.length] = parseInt(b.substr(e, 2), 16);
    return a
}
function strToUtf8Bytes(b) {
    var a = [];
    var d = b.length;
    for (var e = 0; e < d; e++) {
        var c = b.charCodeAt(e);
        65536 <= c && 1114111 >= c ? (a.push(c >> 18 & 7 | 240), a.push(c >> 12 & 63 | 128), a.push(c >> 6 & 63 | 128), a.push(c & 63 | 128)) : 2048 <= c && 65535 >= c ? (a.push(c >> 12 & 15 | 224), a.push(c >> 6 & 63 | 128), a.push(c & 63 | 128)) : 128 <= c && 2047 >= c ? (a.push(c >> 6 & 31 | 192), a.push(c & 63 | 128)) : a.push(c & 255)
    }
    return a
}
function bytesToUtf8Str(b) {
    try {
        for (var a = "",
        d = 0; d < b.length; d++) {
            var e = b[d].toString(2),
            c = e.match(/^1+?(?=0)/);
            if (c && 8 == e.length) {
                for (var f = c[0].length, h = b[d].toString(2).slice(7 - f), g = 1; g < f; g++) h += b[g + d].toString(2).slice(2);
                a += String.fromCharCode(parseInt(h, 2));
                d += f - 1
            } else a += String.fromCharCode(b[d])
        }
        return a
    } catch(k) {
        alert("\u8f6cUTF8\u51fa\u9519\uff0c\u975eUTF8\u7684\u4e8c\u8fdb\u5236\u6570\u7ec4")
    }
}
function clearArray(b, a, d) {
    for (elm in b) b[elm] = null
}
function copyArray(b, a, d, e, c) {
    b = b.slice(a, a + c);
    for (a = 0; a < b.length; a++) d[e] = b[a],
    e++
};

/**
 * sm4.js
 */
function SM4Cipher() {
    this.SM4_ENCRYPT = 1;
    this.SM4_DECRYPT = 0;
    this.S_BOX_TABLE = [214, 144, 233, 254, 204, 225, 61, 183, 22, 182, 20, 194, 40, 251, 44, 5, 43, 103, 154, 118, 42, 190, 4, 195, 170, 68, 19, 38, 73, 134, 6, 153, 156, 66, 80, 244, 145, 239, 152, 122, 51, 84, 11, 67, 237, 207, 172, 98, 228, 179, 28, 169, 201, 8, 232, 149, 128, 223, 148, 250, 117, 143, 63, 166, 71, 7, 167, 252, 243, 115, 23, 186, 131, 89, 60, 25, 230, 133, 79, 168, 104, 107, 129, 178, 113, 100, 218, 139, 248, 235, 15, 75, 112, 86, 157, 53, 30, 36, 14, 94, 99, 88, 209, 162, 37, 34, 124, 59, 1, 33, 120, 135, 212, 0, 70, 87, 159, 211, 39, 82, 76, 54, 2, 231, 160, 196, 200, 158, 234, 191, 138, 210, 64, 199, 56, 181, 163, 247, 242, 206, 249, 97, 21, 161, 224, 174, 93, 164, 155, 52, 26, 85, 173, 147, 50, 48, 245, 140, 177, 227, 29, 246, 226, 46, 130, 102, 202, 96, 192, 41, 35, 171, 13, 83, 78, 111, 213, 219, 55, 69, 222, 253, 142, 47, 3, 255, 106, 114, 109, 108, 91, 81, 141, 27, 175, 146, 187, 221, 188, 127, 17, 217, 92, 65, 31, 16, 90, 216, 10, 193, 49, 136, 165, 205, 123, 189, 45, 116, 208, 18, 184, 229, 180, 176, 137, 105, 151, 74, 12, 150, 119, 126, 101, 185, 241, 9, 197, 110, 198, 132, 24, 240, 125, 236, 58, 220, 77, 32, 121, 238, 95, 62, 215, 203, 57, 72];
    this.FK = ["-5c4e453a", "56aa3350", "677d9197", "-4d8fdd24"];
    this.CK = "70e15 1c232a31 383f464d 545b6269 70777e85 -736c655f -57504943 -3b342d27 -1f18110b -3fcf5ef 181f262d 343b4249 50575e65 6c737a81 -77706963 -5b544d47 -3f38312b -231c150f -700f9f3 141b2229 30373e45 4c535a61 686f767d -7b746d67 -5f58514b -433c352f -27201913 -b04fdf7 10171e25 2c333a41 484f565d 646b7279".split(" ");
    this.getUlongBE = function(b, a) {
        var c = (new BigInteger(String(b[a] & 255))).shiftLeft(24),
        d = (new BigInteger(String(b[a + 1] & 255))).shiftLeft(16),
        e = (new BigInteger(String(b[a + 2] & 255))).shiftLeft(8);
        b = (new BigInteger(String(b[a + 3] & 255))).and(new BigInteger("FFFFFFFF", 16));
        return c.or(d).or(e).or(b)
    };
    this.putUlongBE = function(b, a, c) {
        a[c] = b.shiftRight(24).and(new BigInteger("0xFF", 16)).byteValue();
        a[c + 1] = b.shiftRight(16).and(new BigInteger("0xFF", 16)).byteValue();
        a[c + 2] = b.shiftRight(8).and(new BigInteger("0xFF", 16)).byteValue();
        a[c + 3] = b.and(new BigInteger("0xFF", 16)).byteValue()
    };
    this.rotl = function(b, a) {
        return b.and(new BigInteger("FFFFFFFF", 16)).shiftLeft(a).or(b.shiftRight(32 - a))
    };
    this.sm4Lt = function(b) {
        var a = Array(4),
        c = Array(4);
        this.putUlongBE(b, a, 0);
        c[0] = this.sm4Sbox(a[0]);
        c[1] = this.sm4Sbox(a[1]);
        c[2] = this.sm4Sbox(a[2]);
        c[3] = this.sm4Sbox(a[3]);
        b = this.getUlongBE(c, 0);
        return b.xor(this.rotl(b, 2)).xor(this.rotl(b, 10)).xor(this.rotl(b, 18)).xor(this.rotl(b, 24))
    };
    this.sm4F = function(b, a, c, d, e) {
        return b.xor(this.sm4Lt(a.xor(c).xor(d).xor(e)))
    };
    this.sm4CalciRK = function(b) {
        var a = Array(4),
        c = Array(4);
        this.putUlongBE(b, a, 0);
        c[0] = this.sm4Sbox(a[0]);
        c[1] = this.sm4Sbox(a[1]);
        c[2] = this.sm4Sbox(a[2]);
        c[3] = this.sm4Sbox(a[3]);
        b = this.getUlongBE(c, 0);
        return b.xor(this.rotl(b, 13)).xor(this.rotl(b, 23))
    };
    this.sm4Sbox = function(b) {
        b = this.S_BOX_TABLE[b & 255];
        return 128 < b ? b - 256 : b
    };
    this.sm4SetKeyEnc = function(b, a) {
        if (null == b) return alert("ctx is null!"),
        !1;
        if (null == a || 16 != a.length) return alert("key error!"),
        !1;
        b.mode = this.SM4_ENCRYPT;
        this.sm4SetKey(b.sk, a)
    };
    this.sm4SetKeyDec = function(b, a) {
        this.sm4SetKeyEnc(b, a);
        b.mode = this.SM4_DECRYPT;
        for (a = 0; 16 > a; a++) {
            var c = b.sk[a];
            b.sk[a] = b.sk[31 - a];
            b.sk[31 - a] = c
        }
    };
    this.sm4SetKey = function(b, a) {
        var c = Array(4),
        d = Array(36);
        c[0] = this.getUlongBE(a, 0);
        c[1] = this.getUlongBE(a, 4);
        c[2] = this.getUlongBE(a, 8);
        c[3] = this.getUlongBE(a, 12);
        d[0] = c[0].xor(new BigInteger(this.FK[0], 16));
        d[1] = c[1].xor(new BigInteger(this.FK[1], 16));
        d[2] = c[2].xor(new BigInteger(this.FK[2], 16));
        d[3] = c[3].xor(new BigInteger(this.FK[3], 16));
        for (a = 0; 32 > a; a++) d[a + 4] = d[a].xor(this.sm4CalciRK(d[a + 1].xor(d[a + 2]).xor(d[a + 3]).xor(new BigInteger(this.CK[a], 16)))),
        b[a] = d[a + 4]
    };
    this.padding = function(b, a) {
        if (null == b) return null;
        if (a == this.SM4_ENCRYPT) {
            var c = parseInt(16 - b.length % 16);
            a = b.slice(0);
            for (var d = 0; d < c; d++) a[b.length + d] = c
        } else c = b[b.length - 1],
        a = b.slice(0, b.length - c);
        return a
    };
    this.sm4OneRound = function(b, a, c) {
        var d = 0,
        e = Array(36);
        e[0] = this.getUlongBE(a, 0);
        e[1] = this.getUlongBE(a, 4);
        e[2] = this.getUlongBE(a, 8);
        for (e[3] = this.getUlongBE(a, 12); 32 > d;) e[d + 4] = this.sm4F(e[d], e[d + 1], e[d + 2], e[d + 3], b[d]),
        d++;
        this.putUlongBE(e[35], c, 0);
        this.putUlongBE(e[34], c, 4);
        this.putUlongBE(e[33], c, 8);
        this.putUlongBE(e[32], c, 12)
    };
    this.sm4CryptEcb = function(b, a) {
        null == a && alert("input is null!");
        b.isPadding && b.mode == this.SM4_ENCRYPT && (a = this.padding(a, this.SM4_ENCRYPT));
        for (var c = 0,
        d = a.length,
        e = []; 0 < d; d -= 16) {
            var g = Array(16),
            f = a.slice(16 * c, 16 * (c + 1));
            this.sm4OneRound(b.sk, f, g);
            e = e.concat(g);
            c++
        }
        a = e;
        b.isPadding && b.mode == this.SM4_DECRYPT && (a = this.padding(a, this.SM4_DECRYPT));
        for (c = 0; c < a.length; c++) 0 > a[c] && (a[c] += 256);
        return a
    };
    this.sm4CryptCbc = function(b, a, c) {
        null != a && 16 == a.length || alert("iv error!");
        null == c && alert("input is null!");
        b.isPadding && b.mode == this.SM4_ENCRYPT && (c = this.padding(c, this.SM4_ENCRYPT));
        var d, e = c.length,
        g = [];
        if (b.mode == this.SM4_ENCRYPT) for (var f = 0; 0 < e; e -= 16) {
            var k = Array(16),
            h = Array(16),
            l = c.slice(16 * f, 16 * (f + 1));
            for (d = 0; 16 > d; d++) k[d] = l[d] ^ a[d];
            this.sm4OneRound(b.sk, k, h);
            a = h.slice(0, 16);
            g = g.concat(h);
            f++
        } else for (f = 0; 0 < e; e -= 16) {
            k = Array(16);
            h = Array(16);
            l = c.slice(16 * f, 16 * (f + 1));
            var m = l.slice(0, 16);
            this.sm4OneRound(b.sk, l, k);
            for (d = 0; 16 > d; d++) h[d] = k[d] ^ a[d];
            a = m.slice(0, 16);
            g = g.concat(h);
            f++
        }
        a = g;
        b.isPadding && b.mode == this.SM4_DECRYPT && (a = this.padding(a, this.SM4_DECRYPT));
        for (d = 0; d < a.length; d++) 0 > a[d] && (a[d] += 256);
        return a
    }
}
function SM4Context() {
    this.mode = 1;
    this.isPadding = !0;
    this.sk = Array(32)
}
function SM4Util() {
    this.sm4Encrypt = function(b, a, c) {
        var d = new SM4Cipher,
        e = new SM4Context;
        b = strToUtf8Bytes(b);
        d.sm4SetKeyEnc(e, b);
        c ? (c = strToUtf8Bytes(c), encrypted = d.sm4CryptCbc(e, c, strToUtf8Bytes(a))) : encrypted = d.sm4CryptEcb(e, strToUtf8Bytes(a));
        return bytesToHex(encrypted)
    };
    this.sm4Decrypt = function(b, a, c) {
        var d = new SM4Cipher,
        e = new SM4Context;
        b = strToUtf8Bytes(b);
        d.sm4SetKeyDec(e, b);
        c ? (c = strToUtf8Bytes(c), encrypted = d.sm4CryptCbc(e, c, hexToBytes(a))) : encrypted = d.sm4CryptEcb(e, hexToBytes(a));
        return bytesToUtf8Str(encrypted)
    }
};
	var sm4 = {
		SM4Util :SM4Util
	};
	module.exports = sm4
});