	.section	__TEXT,__text,regular,pure_instructions
	.build_version macos, 14, 0
	.globl	_square                         ; -- Begin function square
	.p2align	2
_square:                                ; @square
	.cfi_startproc
; %bb.0:
	mul	w0, w0, w0
	ret
	.cfi_endproc
                                        ; -- End function
	.globl	_add                            ; -- Begin function add
	.p2align	2
_add:                                   ; @add
	.cfi_startproc
; %bb.0:
	add	w0, w0, w1
	ret
	.cfi_endproc
                                        ; -- End function
	.globl	_main                           ; -- Begin function main
	.p2align	2
_main:                                  ; @main
	.cfi_startproc
; %bb.0:
	sub	sp, sp, #48
	stp	x20, x19, [sp, #16]             ; 16-byte Folded Spill
	stp	x29, x30, [sp, #32]             ; 16-byte Folded Spill
	.cfi_def_cfa_offset 48
	.cfi_offset w30, -8
	.cfi_offset w29, -16
	.cfi_offset w19, -24
	.cfi_offset w20, -32
	mov	w8, #3                          ; =0x3
	mov	w19, #2                         ; =0x2
	mov	w0, #1                          ; =0x1
	mov	w1, #2                          ; =0x2
	strb	w8, [sp, #15]
	strb	w19, [sp, #14]
	bl	_add
	mov	w0, #2                          ; =0x2
	strb	w19, [sp, #15]
	strb	wzr, [sp, #13]
	bl	_square
	ldp	x29, x30, [sp, #32]             ; 16-byte Folded Reload
	strb	w0, [sp, #13]
	ldp	x20, x19, [sp, #16]             ; 16-byte Folded Reload
	add	sp, sp, #48
	ret
	.cfi_endproc
                                        ; -- End function
	.globl	_GLOBAL                         ; @GLOBAL
.zerofill __DATA,__common,_GLOBAL,1,0
.subsections_via_symbols
