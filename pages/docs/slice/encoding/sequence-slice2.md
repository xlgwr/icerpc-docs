---
title: Sequence
description: Learn how to encode a sequence with Slice.
---

{% title /%}

## Non-optional element type

A sequence of N elements with a non-optional element type T is encoded as a varuint62-encoded N followed by each element
encoded in order.

_Example 1_

An empty sequence is encoded as:
```
0x00: size = 0
```

_Example 2_

A sequence of int32 with value 5, 32, 2 is encoded as:
```
0x0c:                3 elements (varuint62 on 1 byte)
0x05 0x00 0x00 0x00: 5 over 4 bytes in little-endian order
0x20 0x00 0x00 0x00: 32 over 4 bytes in little-endian order
0x02 0x00 0x00 0x00: 2 over 4 bytes in little-endian order
```

## Non-optional element type

A sequence of N elements with a optional element type T? is encoded as a varuint62-encoded N followed by a
[bit sequence](bit-sequence) with N bits, followed by each element with a value encoded in order.

_Example 3_

A sequence of `int32?` with value 5, no-value, 2, no-value is encoded as:
```
0x10:              : 4 elements (varuint62 on 1 byte)
00 00 01 01:       : bit sequence with positions 0 and 2 set
0x05 0x00 0x00 0x00: 5 over 4 bytes in little-endian order
0x02 0x00 0x00 0x00: 2 over 4 bytes in little-endian order
```