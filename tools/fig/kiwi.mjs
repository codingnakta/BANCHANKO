// 최소 Kiwi 바이너리 스키마 리더/디코더 (evanw/kiwi 포맷)
export class ByteBuffer {
  constructor(data) {
    this.data = data
    this.index = 0
  }
  get remaining() {
    return this.data.length - this.index
  }
  readByte() {
    if (this.index >= this.data.length) throw new Error('EOF')
    return this.data[this.index++]
  }
  readVarUint() {
    let shift = 0
    let result = 0
    for (;;) {
      const b = this.readByte()
      result |= (b & 0x7f) << shift
      shift += 7
      if ((b & 0x80) === 0 || shift >= 35) break
    }
    return result >>> 0
  }
  readVarInt() {
    const v = this.readVarUint()
    return (v >>> 1) ^ -(v & 1)
  }
  readVarUint64() {
    let shift = 0n
    let result = 0n
    for (;;) {
      const b = this.readByte()
      result |= BigInt(b & 0x7f) << shift
      shift += 7n
      if ((b & 0x80) === 0 || shift >= 70n) break
    }
    return result
  }
  readVarInt64() {
    const v = this.readVarUint64()
    return (v >> 1n) ^ -(v & 1n)
  }
  /** kiwi float: 첫 바이트가 0이면 0.0, 아니면 4바이트를 23비트 회전 */
  readFloat() {
    if (this.index + 4 > this.data.length) {
      if (this.data[this.index] === 0) {
        this.index++
        return 0
      }
      throw new Error('EOF(float)')
    }
    const d = this.data
    const i = this.index
    let bits = (d[i] | (d[i + 1] << 8) | (d[i + 2] << 16) | (d[i + 3] << 24)) >>> 0
    if ((bits & 255) === 0) {
      this.index++
      return 0
    }
    this.index += 4
    bits = ((bits << 23) | (bits >>> 9)) >>> 0
    const buf = new ArrayBuffer(4)
    new Uint32Array(buf)[0] = bits
    return new Float32Array(buf)[0]
  }
  readString() {
    const start = this.index
    while (this.index < this.data.length && this.data[this.index] !== 0) this.index++
    const s = this.data.toString('utf8', start, this.index)
    this.index++ // null terminator
    return s
  }
  readBytes(n) {
    const b = this.data.subarray(this.index, this.index + n)
    this.index += n
    return b
  }
}

const BUILTIN = {
  '-1': 'bool',
  '-2': 'byte',
  '-3': 'int',
  '-4': 'uint',
  '-5': 'float',
  '-6': 'string',
  '-7': 'int64',
  '-8': 'uint64',
}

/** 컴파일된 kiwi 스키마 바이너리를 정의 목록으로 디코딩 */
export function decodeSchema(buffer) {
  const bb = new ByteBuffer(buffer)
  const count = bb.readVarUint()
  const defs = []
  for (let i = 0; i < count; i++) {
    const name = bb.readString()
    const kind = bb.readByte() // 0 ENUM, 1 STRUCT, 2 MESSAGE
    const fieldCount = bb.readVarUint()
    const fields = []
    for (let j = 0; j < fieldCount; j++) {
      const fname = bb.readString()
      const type = bb.readVarInt()
      const isArray = !!(bb.readByte() & 1)
      const value = bb.readVarUint()
      fields.push({ name: fname, type, isArray, value })
    }
    defs.push({ name, kind: ['ENUM', 'STRUCT', 'MESSAGE'][kind], fields })
  }
  return defs
}

/** 스키마를 이용해 메시지 본문을 디코딩 */
export function createDecoder(defs) {
  const byIndex = defs
  const byName = new Map(defs.map((d) => [d.name, d]))

  function readValue(bb, type) {
    if (type < 0) {
      switch (BUILTIN[String(type)]) {
        case 'bool':
          return !!bb.readByte()
        case 'byte':
          return bb.readByte()
        case 'int':
          return bb.readVarInt()
        case 'uint':
          return bb.readVarUint()
        case 'float':
          return bb.readFloat()
        case 'string':
          return bb.readString()
        case 'int64':
          return bb.readVarInt64().toString()
        case 'uint64':
          return bb.readVarUint64().toString()
        default:
          throw new Error('알 수 없는 빌트인 타입 ' + type)
      }
    }
    return readDef(bb, byIndex[type])
  }

  function readDef(bb, def) {
    if (!def) throw new Error('정의 없음')
    if (def.kind === 'ENUM') {
      const v = bb.readVarUint()
      const f = def.fields.find((x) => x.value === v)
      return f ? f.name : v
    }
    if (def.kind === 'STRUCT') {
      const obj = {}
      for (const f of def.fields) obj[f.name] = readField(bb, f)
      return obj
    }
    // MESSAGE
    const obj = {}
    for (;;) {
      const id = bb.readVarUint()
      if (id === 0) break
      const f = def.fields.find((x) => x.value === id)
      if (!f) throw new Error(`${def.name}: 알 수 없는 필드 id ${id}`)
      obj[f.name] = readField(bb, f)
    }
    return obj
  }

  function readField(bb, f) {
    if (f.isArray) {
      const n = bb.readVarUint()
      const arr = new Array(n)
      for (let i = 0; i < n; i++) arr[i] = readValue(bb, f.type)
      return arr
    }
    return readValue(bb, f.type)
  }

  return {
    defs,
    byName,
    decode(buffer, rootName) {
      const bb = new ByteBuffer(buffer)
      const root = byName.get(rootName)
      if (!root) throw new Error(`루트 타입 ${rootName} 없음`)
      return readDef(bb, root)
    },
  }
}
